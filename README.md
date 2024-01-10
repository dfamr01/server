# Blipy.tv - server

## Runbook

### Deploy

1. Commit to branch
1. bitbucket deploys

### Development

1. `nvm install 14` - install node v 14 and up.
1. `npm install` - install dependencies.
1. Update `server/config/env/.env.dev` If instructed.
1. `npm run start` - start dev env

## Setting up databases

#### both

`sudo apt update`

#### Postress

1. https://www.digitalocean.com/community/tutorials/how-to-install-and-use-postgresql-on-ubuntu-20-04 - install
1. https://blog.logrocket.com/setting-up-a-remote-postgres-database-server-on-ubuntu-18-04/ - open to public
1. `sudo apt install postgresql postgresql-contrib`
1. `sudo -i -u postgres`
1. `createuser -Pd streamme_user`
1. `createdb streamme_db`

#### Redis

1. https://www.digitalocean.com/community/tutorials/how-to-install-and-secure-redis-on-ubuntu-20-04 - install
1. `sudo apt install redis-server`
1. `sudo nano /etc/redis/redis.conf`
1. `supervised systemd`
1. `sudo systemctl restart redis.service`

#### Opened ports:

1. `5432`, `22`, `6379`

#### Relevant links

1. https://linuxhint.com/postgresql-nodejs-tutorial/
1. https://linuxhint.com/install-postgresql-ubuntu-easy/
