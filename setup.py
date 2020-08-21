from setuptools import setup, find_packages

LONG_DESCRIPTION = """
Malware repository component for automated malware collection/analysis systems.

Under the hood of mwdb.cert.pl service hosted by CERT.pl.
"""

setup(name="malwarecage",
      version="2.0.0a2-dev3",
      description="Malwarecage malware database",
      long_description=LONG_DESCRIPTION,
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
      ])
