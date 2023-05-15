const fs = require('fs')
class Operations {
  constructor() {
    this.account = {};
    this.destino = {};
  }
  trataRunFunction(widget) {
    let returnedWidget = widget;
    let serviceName = "";
    let functionName = "";
    let environmentName = "";
    let domainName = ""
    let serviceSidDestino = ""
    let environmentSidDestino = ""
    let functionSidDestino = ""
    let functionUrl = ""

    const { service_sid, environment_sid, function_sid, url } =
      returnedWidget.properties;
    serviceName = this.account.flow.serverless[service_sid].friendlyName;

    Object.keys(this.destino.flow.serverless).forEach(
      (serverless) => {
        if (this.destino.flow.serverless[serverless].friendlyName == serviceName) {
          serviceSidDestino = serverless;
        }
      }
    );

    // this.account.flow.serverless[service_sid].environments;

    this.account.flow.serverless[service_sid].environments.forEach(
      (environmentMap) => {
        if (environmentMap.sid == environment_sid) {
          environmentName = environmentMap.uniqueName;
        }
      }
    );

    this.destino.flow.serverless[serviceSidDestino].environments.forEach(
      (environmentMap) => {
        if (environmentMap.uniqueName == environmentName) {
          // console.log(environmentMap)
          environmentSidDestino = environmentMap.sid;
          domainName = environmentMap.domainName
        }
      }
    );
    this.account.flow.serverless[service_sid].functions.forEach(
      (functionMap) => {
        if (functionMap.sid == function_sid) {
          functionName = functionMap.friendlyName;
        }
      }
    );

    this.destino.flow.serverless[serviceSidDestino].functions.forEach(
      (functionMap) => {
        if (functionMap.friendlyName == functionName) {
          functionSidDestino = functionMap.sid;
          functionUrl = `https://${domainName}${functionMap.friendlyName}`
        }
      }
    );
    returnedWidget.properties.service_sid = serviceSidDestino
    returnedWidget.properties.environment_sid = environmentSidDestino
    returnedWidget.properties.function_sid = functionSidDestino
    returnedWidget.properties.url = functionUrl


    return returnedWidget;
  }

  trataRunSubFlow(widget) {
    //caso não exista o subflow com o mesmo nome, criar um zerado somente para fazer o vínculo

    let returnedWidget = widget;
    let flowName = "";
    const { flow_sid } = returnedWidget.properties;

    this.account.flows.map((flowMap) => {
      if (flowMap.sid == flow_sid) {
        flowName = flowMap.friendlyName;
      }
    });

    this.destino.flows.map((flowMap) => {

      if (flowMap.friendlyName == flowName) {
        returnedWidget.properties.flow_sid = flowMap.sid;
      }
    });

    return returnedWidget;
  }

  trataSendToFlex(widget) {
    let returnedWidget = widget;
    const workflow = returnedWidget.properties.workflow;
    let workflowName = "";
    let taskChannelName = "";

    this.account.flow.taskrouter.workflows.map((workflowMap) => {
      if (workflowMap.sid == workflow) {
        workflowName = workflowMap.friendlyName;
      }
    });

    this.destino.flow.taskrouter.workflows.map((workflowMap) => {
      if (workflowMap.friendlyName == workflowName) {
        returnedWidget.properties.workflow = workflowMap.sid;
      }
    });

    Object.keys(this.account.flow.taskrouter.taskChannels).map((taskChannelMap) => {
      if (this.account.flow.taskrouter.taskChannels[taskChannelMap] == returnedWidget.properties.channel) {
        taskChannelName = taskChannelMap
      }
    });

    Object.keys(this.destino.flow.taskrouter.taskChannels).map((taskChannelMap) => {
      if (taskChannelMap == taskChannelName) {
        returnedWidget.properties.channel = this.destino.flow.taskrouter.taskChannels[taskChannelMap]
      }
    });
    return returnedWidget;
  }

  getWorkSpaces(account) {
    return account.acesso.work;
  }
  getWorkFlows(account) { }
  getTaskQueues(account) { }

  flowMigration(origem, destino) {
    this.account = origem;
    this.destino = destino;
    this.flowDest = {};
    this.flowDest = origem.flow.jFlow;
    this.newFlow = {}

    const states = [];

    origem.flow.jFlow.definition.states.map((widget) => {
      switch (widget.type) {
        case "run-subflow":
          states.push(this.trataRunSubFlow(widget));
          break;
        case "run-function":
          states.push(this.trataRunFunction(widget));
          break;
        case "send-to-flex":
          states.push(this.trataSendToFlex(widget));
          break;

        default:
          states.push(widget);
          break;
      }
    });

    this.flowDest.definition.states = states;
    // console.log(this.flowDest.definition.states);
    fs.writeFile('fluxo.json', JSON.stringify(this.flowDest.definition), 'utf8', function(err) {
      // if (err) throw err;
      if (err) {
        console.error('Erro para salvar o arquivo com o novo Flow', err)
      }
    });
    this.newFlow = this.flowDest.definition

  }

}

module.exports = new Operations();
