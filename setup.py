from setuptools import setup, find_packages

LONG_DESCRIPTION = """
Malware repository component for automated malware collection/analysis systems.

Under the hood of mwdb.cert.pl service hosted by CERT.pl.
"""

setup(name="mwdb-core",
      version="2.6.0",
      description="MWDB Core malware database",
      long_description=LONG_DESCRIPTION,
      author="CERT Polska",
      author_email="info@cert.pl",
      packages=find_packages(),
      include_package_data=True,
      url="https://github.com/CERT-Polska/mwdb-core",
      install_requires=open("requirements.txt").read().splitlines(),
      python_requires='>=3.7',
      entry_points={
        'console_scripts': [
            'mwdb-core=mwdb.cli:cli'
        ],
      },
      classifiers=[
        "Development Status :: 5 - Production/Stable",
        "Operating System :: POSIX :: Linux",
        "Programming Language :: Python :: 3"
      ])
