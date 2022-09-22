#FROM debian:bullseye-slim
#FROM python:3.8-slim-bullseye

FROM nvidia/cuda:11.5.0-cudnn8-devel-ubuntu20.04
RUN apt update -y
RUN apt update && apt install -y exiftool
RUN apt update && apt install -y curl

ARG DEBIAN_FRONTEND=noninteractive
ENV TZ=America/Regina
RUN apt-get install -y tzdata

RUN curl -fsSL https://deb.nodesource.com/setup_14.x | bash -
RUN apt install -y libgl1
RUN apt-get install -y libglib2.0-0
RUN apt update && apt-get install -y linux-libc-dev
RUN apt update && apt install -y nodejs
RUN apt update && apt install -y python3
RUN apt update && apt install -y python3-pip
RUN apt update && apt install -y iproute2
RUN apt update && apt install -y iputils-ping
RUN apt update && apt install -y dnsutils
RUN mkdir -p /opt/app
WORKDIR /opt/app
RUN adduser app
RUN usermod -a -G app app 
COPY --chown=app plant_detection ./plant_detection
COPY --chown=app plant_detection_viewer ./plant_detection_viewer
RUN pip3 install --upgrade pip
RUN pip3 install --no-cache-dir --debug libclang
RUN pip3 install -r ./plant_detection/src/requirements.txt
WORKDIR ./plant_detection_viewer/myapp
RUN npm install
RUN apt update && apt install -y postgresql-client
RUN apt update && apt install -y imagemagick
#COPY --chown=app ./node_modules/annotorious ./node_modules/annotorious
#COPY --chown=app ./node_modules/openseadragon3 ./node_modules/openseadragon3
RUN ln -s /usr/bin/python3 /usr/bin/python
RUN sed -i 's/policy domain="resource" name="disk" value="1GiB"/policy domain="resource" name="disk" value="8GiB"/' /etc/ImageMagick-6/policy.xml

USER app
#RUN chown -R app:app /opt/app/plant_detection/src/usr
RUN ln -s /opt/app/plant_detection/src/usr /opt/app/plant_detection_viewer/myapp/usr
RUN chmod +x myapp-init.sh
CMD /bin/sh /opt/app/plant_detection_viewer/myapp/myapp-init.sh
EXPOSE 8115
