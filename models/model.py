from odoo import fields, models, api

class ResConfigSettings(models.TransientModel):
    _inherit = 'res.config.settings'

    room_meeting_interval = fields.Integer(
        string="Room Meeting Interval",
        default=30,
        config_parameter="room_meeting_interval"
    )

    @api.model
    def get_meeting_interval(self):
        return int(self.env['ir.config_parameter'].sudo().get_param('room_meeting_interval', '30'))