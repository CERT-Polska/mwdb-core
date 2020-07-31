from setuptools import setup, find_packages

setup(name="malwarecage",
      version="2.0.0-alpha2",
      description="Malwarecage malware database",
      author="CERT-Polska",
      packages=find_packages(),
      include_package_data=True,
      url="https://github.com/CERT-Polska/malwarecage",
      install_requires=open("requirements.txt").read().splitlines(),
      entry_points={
        'console_scripts': [
            'malwarecage=malwarecage.cli:cli'
        ],
      },
      classifiers=[
        "Programming Language :: Python 3",
        "Operating System :: OS Independent",
      ])
