FROM node:14.18.1-alpine3.14
RUN mkdir -p /opt/app
WORKDIR /opt/app
RUN addgroup --gid 1050 app 
RUN adduser -G app -S app
#RUN adduser -S app
#RUN addgroup app -S app
#COPY myapp/ .
COPY --chown=app myapp/ .
RUN npm install
#RUN chown -R app /opt/app

#RUN chmod +x docker-initdb.sh
#RUN chmod +x wait-for-postgres.sh
RUN apk --no-cache add postgresql-client
USER app
RUN chmod +x myapp-init.sh
CMD /bin/sh /opt/app/myapp-init.sh
#CMD /bin/sh -c 'echo --- Now Starting'
# , ";", "/opt/app/wait-for-postgres.sh", ";", "/opt/app/docker-initdb.sh", ";", "npm", "run", "start"]
EXPOSE 8110
#CMD [ "npm", "run", "start" ]
