FROM debian:bullseye-slim
RUN apt update -y
RUN apt update && apt install -y curl
RUN curl -fsSL https://deb.nodesource.com/setup_14.x | bash -
RUN apt install -y libgl1
RUN apt-get install -y libglib2.0-0
RUN apt install -y nodejs
RUN apt install python3
RUN apt install -y python3-pip
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
RUN apt install -y postgresql-client
USER app
RUN chmod +x myapp-init.sh
CMD /bin/sh /opt/app/plant_detection_viewer/myapp/myapp-init.sh
EXPOSE 8110
