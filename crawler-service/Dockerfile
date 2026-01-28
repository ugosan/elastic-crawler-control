FROM python:3.11-slim

RUN apt-get update && apt-get install -y \
    curl \
    git \
    openjdk-21-jre-headless \
    && rm -rf /var/lib/apt/lists/*

ENV JRUBY_VERSION=9.4.8.0
RUN curl -fsSL https://repo1.maven.org/maven2/org/jruby/jruby-dist/${JRUBY_VERSION}/jruby-dist-${JRUBY_VERSION}-bin.tar.gz \
    | tar -xz -C /opt && \
    ln -s /opt/jruby-${JRUBY_VERSION} /opt/jruby

ENV PATH="/opt/jruby/bin:${PATH}"
ENV JRUBY_OPTS="--dev"

RUN git clone --depth=1 https://github.com/elastic/crawler.git /crawler

WORKDIR /crawler

RUN jruby -S bundle install

WORKDIR /app

COPY requirements.txt .
RUN python3.11 -m pip install --no-cache-dir -r requirements.txt

COPY app/* .

EXPOSE 8000

CMD ["python3.11", "server.py"]
