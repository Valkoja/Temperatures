# !/usr/bin/python3
# -*- coding: utf-8 -*-

import logging
from socket_wrap import SocketWrap

logging.basicConfig(filename='/var/log/temperature_errors.log', level=logging.ERROR, format='%(asctime)s - %(message)s', datefmt='%Y.%m.%d %H:%M:%S')

try:
    socketObj = SocketWrap(logging.getLogger(__name__))
    socketObj.send('Hourly update')

except Exception as err:
    logging.error(err)