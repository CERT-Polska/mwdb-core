import os

package_dir = os.path.dirname(os.path.realpath(__file__))

migrations_dir = os.path.abspath(os.path.join(package_dir, "model/migrations"))

web_package_dir = os.path.abspath(os.path.join(package_dir, "web"))
web_bundle_dir = os.path.join(web_package_dir, "build")

templates_dir = os.path.join(package_dir, "templates")
mail_templates_dir = os.path.join(templates_dir, "mail")
