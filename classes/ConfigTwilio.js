const prompts = require("prompts");
require("dotenv").config();
const fs = require("fs");
const os = require("os");

class twilioAccount {
  constructor(id, apiKey, apiSecret, accountSid) {
    this.id = "";
    this.client = require("twilio")(apiKey, apiSecret, {
      accountSid: accountSid,
    });
    this.workSpace = {}

  }

  async getWorkSpaces() {
    const resp = await this.client.taskrouter.v1.workspaces
      .list({
        limit: 1,
      })
    this.workSpace = resp[0];
  }
}

class ConfigTwilio {
  constructor() {
    this.accounts = {};
    this.so = os.platform();
    this.configTwilio = JSON.parse(
      fs.readFileSync(os.homedir() + "/.twilio-cli/config.json", "utf8")
    );
    this.profiles = this.configTwilio.profiles;
  }

  setSeparaAccount(origem, destino) {
    this.accounts = {
      origem: {
        acesso: new twilioAccount(
          origem.id,
          origem.apiKey,
          origem.apiSecret,
          origem.accountSid
        ),
      },
      destino: {
        acesso: new twilioAccount(
          destino.id,
          destino.apiKey,
          destino.apiSecret,
          destino.accountSid
        ),
      },
    };
  }

  iniciaSingleAccount(conta) {
    this.accounts = {
      acesso: new twilioAccount(
        conta.id,
        conta.apiKey,
        conta.apiSecret,
        conta.accountSid
      ),
    };
  }

  getPrompt() {
    return { title: this.id, value: this.profile };
  }

  getClient() {
    this.client = require("twilio")(this.apiKey, this.apiSecret, {
      accountSid: this.accountSid,
    });
  }

  getChoices() {
    const choices = Object.keys(this.profiles).map((pro) => {
      return {
        title: pro,
        value: pro,
      };
    });
    return choices;
  }

  setInfo(info) {
    this.id = info.id;
    this.apiKey = info.apiKey;
    this.apiSecret = info.apiSecret;
    this.accountSid = info.accountSid;
  }
}
module.exports = new ConfigTwilio();
