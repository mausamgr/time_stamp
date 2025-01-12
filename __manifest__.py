# -*- coding: utf-8 -*-
{
    'name': 'timestamp',
    'version': '17.1',
    'summary': '',
    'description': """""",
    'author': 'Smarten Technologies',
    'website': '',
    'depends': [
        'base',
        'room',
    ],
    'data': [
        'view/view.xml'
    ],
    "assets": {
        "room.assets_room_booking": [
            "room_time_stamp/static/src/js/room_booking_form_patch.js",
        ],
    },
    
    
    'demo': [],
    'installable': True,
    'auto_install': False,
    'application': True,
    'license': 'AGPL-3'

}