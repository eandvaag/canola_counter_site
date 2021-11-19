FROM node:14.18.1-alpine3.14
RUN mkdir -p /opt/app
WORKDIR /opt/app
RUN addgroup --gid 1050 app 
RUN adduser -G app -S app
COPY --chown=app myapp/ .
RUN npm install
RUN apk --no-cache add postgresql-client
USER app
RUN chmod +x myapp-init.sh
CMD /bin/sh /opt/app/myapp-init.sh
EXPOSE 8110
