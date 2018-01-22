#!/usr/bin/env python2
import argparse

from libs.web import app, inspect_routes


### import our routes
import urls
import pkgutil

for loader, module_name, is_pkg in pkgutil.walk_packages(urls.__path__):
    full_name = urls.__name__ + '.' + module_name
    __import__(full_name)


@app.route('/test', method='GET')
def test():
    for prefixes, route in inspect_routes(app):
        abs_prefix = '/'.join(part for p in prefixes for part in p.split('/'))
        print abs_prefix, route.rule, route.method, route.callback


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("-H", "--host", help="Host to bind the API server on", default="localhost", action="store",
                        required=False)
    parser.add_argument("-p", "--port", help="Port to bind the API server on", default=8080, action="store",
                        required=False)
    args = parser.parse_args()

    for prefixes, route in inspect_routes(app):
        abs_prefix = '/'.join(part for p in prefixes for part in p.split('/'))
        print abs_prefix, route.rule, route.method, route.callback

    app.run(host=args.host, port=args.port,reloader=True)
