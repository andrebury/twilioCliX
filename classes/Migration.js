const configTwilio = require("./classes/ConfigTwilio");
const flows = require("./classes/Flows");
const flow = require("./classes/Flow");
const operations = require("./classes/Operations");

const prompts = require("prompts");

(async () => {
  //acessos
  const choosedAccount = await prompts([
    {
      type: "select",
      name: "origem",
      message: "Selecione a conta origem",
      choices: configTwilio.getChoices(),
      initial: 0,
    },
    {
      type: "select",
      name: "destino",
      message: "Selecione a conta destino",
      choices: configTwilio.getChoices(),
      initial: 0,
    },
  ]);

  configTwilio.profiles[choosedAccount.origem]["id"] = choosedAccount.origem;
  configTwilio.profiles[choosedAccount.destino]["id"] = choosedAccount.destino;

  configTwilio.setSeparaAccount(
    configTwilio.profiles[choosedAccount.origem],
    configTwilio.profiles[choosedAccount.destino]
  );

  //baixar as informações de flow e serverless

  const flowOrigem = new flows(choosedAccount.origem);
  const flowDestino = new flows(choosedAccount.destino);
  await flowOrigem.getFlows(configTwilio.accounts.origem.acesso.client);
  await flowDestino.getFlows(configTwilio.accounts.destino.acesso.client);
  operations.flowMigration(flowOrigem, flowDestino);
})();
