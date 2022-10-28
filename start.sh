#!/bin/sh

pipenv run gunicorn --bind 127.0.0.1:5000 -k gevent --worker-connections 1000 app:app