/** @odoo-module **/

import { RoomBookingForm } from "@room/room_booking/room_booking_form/room_booking_form";
import { patch } from "@web/core/utils/patch";
import { registry } from "@web/core/registry";

patch(RoomBookingForm.prototype, {
    // setup() {
    //     super.setup();
    //     this.rpc = registry.category("services").get("rpc");
    //     this.loadMeetingInterval();
    // },
    //
    // async loadMeetingInterval() {
    //     this.meetingInterval = await this.rpc('/web/dataset/call_kw/res.config.settings/get_meeting_interval', {
    //         model: 'res.config.settings',
    //         method: 'get_meeting_interval',
    //         args: [],
    //         kwargs: {},
    //     });
    // },
    /**
     * Getter method to compute and return the available slots.
     * Slots are calculated based on the selected day and current time.
     */
    get slots() {

        // this.meetingInterval = 30
        const intervals = [];
        const isToday = this.state.selectedDay.equals(this.today);
        // If the day selected is the current day, the first slot starts at the current time
        if (isToday) {
            let firstSlotTime = luxon.DateTime.now();
            if (this.state.bookingStart && this.state.bookingStart < firstSlotTime) {
                // Make sure that the selected start is shown
                firstSlotTime = this.state.bookingStart;
            }
            intervals.push(
                luxon.Interval.fromDateTimes(
                    firstSlotTime,
                    firstSlotTime
                    .plus({ minutes: this.meetingInterval - (firstSlotTime.minute % this.meetingInterval) })
                    .startOf("minute"),
                ),
            );
        }
        // Fill with remaining intervals of the day, or with all intervals of the day
        const remainingInterval = luxon.Interval.fromDateTimes(
            intervals[0] ?.end || this.state.selectedDay,
            this.state.selectedDay.plus({ day: 1 }),
        );
        intervals.push(...remainingInterval.splitBy({ minutes: 30 }));

        const bookings = this.bookingsByDate[this.state.selectedDay.toISODate()] || [];
        let bookingIdx = 0;
        let isBooked = false;
        let isInSelectedInterval = false;
        let canBeEndDate = false;
        // Bookings created from backend could span several days, so we need to make
        // sure that all slots between the start and end are marked as selected,
        // even if the start is not in the selected day
        if (
            this.props.bookingToEdit &&
            this.props.bookingToEdit.interval.start < this.state.selectedDay &&
            this.props.bookingToEdit.interval.end > this.state.selectedDay
        ) {
            isInSelectedInterval = true;
            canBeEndDate = true;
        }
        const slots = [];
        for (const interval of intervals) {
            const slot = {
                start: interval.start,
                isInSelectedInterval,
                canBeEndDate,
            };
            if (this.state.bookingEnd && interval.contains(this.state.bookingEnd)) {
                // Slot is the selected end (first condition in case start and stop are
                // in the same slot)
                isInSelectedInterval = false;
            } else if (this.state.bookingStart && interval.contains(this.state.bookingStart)) {
                // Slot is the selected start
                slot.isInSelectedInterval = true;
                // Following slots until the next booking can be selected as end date
                canBeEndDate = true;
                // Following slots until the selected end date are in the selected interval
                isInSelectedInterval = Boolean(this.state.bookingEnd);
            } else if (canBeEndDate && !isInSelectedInterval) {
                // Show the duration of the booking if this slot was used as end date
                slot.description = interval.start
                    .diff(this.state.bookingStart)
                    .toFormat(this.durationFormat);
            }
            if (bookings[bookingIdx] ?.overlaps(interval) && !isBooked) {
                // Slot contains the start of a booking
                isBooked = true;
                canBeEndDate = false;
            }
            slot.isBooked = isBooked;
            if (isBooked && interval.end >= bookings[bookingIdx].end) {
                // Slot contains the end of the booking
                isBooked = false;
                bookingIdx++;
            }
            slots.push(slot);
        }
        // Add midnight slot if the last time slot can be used as end of the booking
        if (this.state.bookingStart && canBeEndDate) {
            const midnight = this.state.selectedDay.plus({ day: 1 });
            const isEnd = this.state.bookingEnd ?.equals(midnight);
            slots.push({
                start: midnight,
                canBeEndDate,
                isInSelectedInterval: isEnd,
                description: isEnd ?
                    false : midnight.diff(this.state.bookingStart).toFormat(this.durationFormat),
            });
        }
        return slots;
    }
});