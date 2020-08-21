from malwarecage.version import app_version
from setuptools import setup, find_packages

long_description = """
Malware repository component for automated malware collection/analysis systems.

Under the hood of mwdb.cert.pl service hosted by CERT.pl.
"""
release = f"{app_version}-dev2"

setup(name="malwarecage",
      version=release,
      description="Malwarecage malware database",
      long_description=long_description,
      author="CERT Polska",
      author_email="info@cert.pl",
      packages=find_packages(),
      include_package_data=True,
      url="https://github.com/CERT-Polska/malwarecage",
      install_requires=open("requirements.txt").read().splitlines(),
      python_requires='>=3.6',
      entry_points={
        'console_scripts': [
            'malwarecage=malwarecage.cli:cli'
        ],
      },
      classifiers=[
        "Development Status :: 3 - Alpha",
        "Operating System :: POSIX :: Linux",
        "Programming Language :: Python :: 3"
      ],
      command_options={
          'build_sphinx': {
              'version': ('setup.py', app_version),
              'release': ('setup.py', release)
          }
      }
)
