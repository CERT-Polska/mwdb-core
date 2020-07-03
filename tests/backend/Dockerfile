FROM python:3.6
ENV MWDB_URL http://mwdb.
COPY requirements.txt /app/requirements.txt
RUN pip3 install -r /app/requirements.txt
COPY *.py /app/
WORKDIR /app
CMD ["pytest"]
