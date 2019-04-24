FROM mcr.microsoft.com/azure-functions/node:2.0

ENV AzureWebJobsScriptRoot=/home/site/wwwroot
ENV AzureFunctionsJobHost__Logging__Console__IsEnabled=true
ENV DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=true

RUN apt-get update && apt-get install -y wget gnupg apt-transport-https
RUN wget -qO - https://packages.confluent.io/deb/5.2/archive.key | apt-key add -
RUN apt-get install -y software-properties-common
RUN add-apt-repository "deb [arch=amd64] https://packages.confluent.io/deb/5.2 stable main"
RUN add-apt-repository "deb http://security.debian.org/debian-security jessie/updates main"

RUN apt-get update && apt install -y librdkafka-dev 

WORKDIR /home/site/wwwroot
COPY . .
RUN npm install && \
    npm run-script build