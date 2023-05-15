const configTwilio = require("./classes/ConfigTwilio");
const flows = require("./classes/Flows");
const operations = require("./classes/Operations");

const prompts = require("prompts");

(async () => {

  //acesso e escolha da operacao
  const choosedAccount = await prompts([
    {
      type: "select",
      name: "conta",
      message: "Selecione a conta",
      choices: configTwilio.getChoices(),
      initial: 0,
    }
    , {
      type: "select",
      name: "operacao",
      message: "Qual operação deseja fazer?",
      choices: [
        {
          title: "Migracão de Flows entre contas",
          value: "flowMigration",
        }
        , {
          title: "Visualizar informações da conta",
          value: "verAccount",
        }],
      initial: 0,
    },
  ]);
  configTwilio.profiles[choosedAccount.conta]["id"] = choosedAccount.conta;


  if (choosedAccount.operacao == "flowMigration") {

    const choosedDestinyAccount = await prompts([{
      type: "select",
      name: "destino",
      message: "Selecione a conta destino",
      choices: configTwilio.getChoices(),
      initial: 0,
    },
    {
      type: "select",
      name: "operacao",
      message: "Qual operação deseja fazer?",
      choices: [
        {
          title: "Criar Novo Flow com base no origem",
          value: "novoFlow",
        }
        , {
          title: "Atualizar Flow com base no origem",
          value: "updateFlow",
        }],
      initial: 0,
    },
    ]);


    configTwilio.profiles[choosedDestinyAccount.destino]["id"] = choosedDestinyAccount.destino;
    configTwilio.setSeparaAccount(
      configTwilio.profiles[choosedAccount.conta],
      configTwilio.profiles[choosedDestinyAccount.destino]
    );

    //Usuário escolhe o flow. a partir disso, coletamos serverless e taskrouter da conta 

    const flowOrigem = new flows(choosedAccount.conta);
    const flowDestino = new flows(choosedDestinyAccount.destino);
    await flowOrigem.getFlows(configTwilio.accounts.origem.acesso.client);


    switch (choosedDestinyAccount.operacao) {
      case "updateFlow":

        //caso seja atualização de flow, iremos pegar as informacoes do flow destino
        await flowDestino.getFlows(configTwilio.accounts.destino.acesso.client);
        //migraçao do flow origem ao flow destino
        operations.flowMigration(flowOrigem, flowDestino);


        break
      case "novoFlow":

        //caso seja criação de flow, iremos pegar o nome do novo flow e as informacoes da conta destino
        await flowDestino.getNewFlow(configTwilio.accounts.destino.acesso.client);
        //migraçao do flow origem ao flow destino
        operations.flowMigration(flowOrigem, flowDestino);
        break
    }

    await flowDestino.updateFlows(configTwilio.accounts.destino.acesso.client, operations.newFlow)
  } else {
    console.log('---------Visualizar informações da conta---------')
    const operation = await prompts([
      {
        type: "select",
        name: "acao",
        message: "Selecione a ação",
        choices: [
          {
            title: "Workspaces",
            value: "workspaces",
          },
          {
            title: "Flows",
            value: "flows",
          },
          {
            title: "Workers",
            value: "workers",
          },
          {
            title: "Tasks",
            value: "tasks",
          },
          {
            title: "WorkFlows",
            value: "workflows",
          },
          {
            title: "TaskQueues",
            value: "taskqueues",
          }
        ],
        initial: 0,
      },
    ]);

    configTwilio.iniciaSingleAccount(configTwilio.profiles[choosedAccount.conta]);
    await configTwilio.accounts.acesso.getWorkSpaces()
    const infoAccount = new flows(choosedAccount.conta);
    switch (operation.acao) {
      case "workspaces":
        console.log(configTwilio.accounts.acesso.workSpace);
        break
      case "Flows":
        await infoAccount.getFlows(configTwilio.accounts.acesso.client);
        console.log(infoAccount.flows)
    }
  }
})();
