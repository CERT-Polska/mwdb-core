# installation

Install required packages:
```bash
sudo apt-get install python-virtualenv postgresql
```

Setup project structure:

```bash
mkdir malwarecage
cd malwarecage

virtualenv . -p python3
source bin/activate

git clone git@vcs.cert.pl:malwaredb/malwarecage.git
cd malwarecage
git checkout dev
```

Copy config:
```bash
cp config.dist.py config.py
```

Install dependencies:
```bash
pip3 install -r requirements.txt
```

Setup postgres:
```bash
sudo -u postgres craeteuser scott
sudo -u postgres createdb test
sudo -u postgres psql
```
```sql
alter user scott with encrypted password 'tiger';
```


Apply db migrations:
```bash
FLASK_APP=app.py python3 -m flask db upgrade
```


Build frontend:
```bash
cd malwarefront

npm install 
npm run build
```

# running

## backendd

```bash
python3 app.py
```

## frontend

```bash
npm start
```

Login with admin:admin
