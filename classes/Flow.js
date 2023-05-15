class Serverless {
  constructor(
    service_sid,
    friendlyName,
    domainBase,
    dateCreated,
    dateUpdated,
    rawFunctions,
    rawEnvironments
  ) {
    this.service_sid = service_sid;
    this.friendlyName = friendlyName;
    this.rawFunctions = rawFunctions;
    this.rawEnvironments = rawEnvironments;
    this.functions = [];
    this.environments = [];
    this.domainBase = domainBase;
    this.dateCreated = dateCreated;
    this.dateUpdated = dateUpdated;
  }

  trataFunctions() {
    this.rawFunctions.map((fun) => {
      this.functions.push({
        sid: fun.sid,
        friendlyName: fun.friendlyName,
      });
    });
    this.rawFunctions = [];
  }
  trataEnvironments() {
    this.rawEnvironments.map((environment) => {
      this.environments.push({
        sid: environment.sid,
        uniqueName: environment.uniqueName,
        buildSid: environment.buildSid,
        domainName: environment.domainName,
      });
    });
    this.rawEnvironments = [];
  }
}

class Taskrouter {
  constructor(workspace) {
    this.workspace = workspace;
    this.taskChannels = {};
    this.workflows = [];
  }
  trataWorkflows(workflows) {
    workflows.map((workflow) => {
      this.workflows.push({
        sid: workflow.sid,
        friendlyName: workflow.friendlyName,
      });
    });
  }
  trataTaskChannels(taskChannels) {
    taskChannels.map((taskchannel) => {
      this.taskChannels[taskchannel.friendlyName] = taskchannel.sid;
    });
  }
}

class Flow {
  constructor(friendlyName, sid, client) {
    this.friendlyName = friendlyName;
    this.sid = sid;
    this.client = client;
    this.jFlow = [];
    this.dateUpdated = "";
    this.dateCreated = "";
    this.changePoints = [];
    this.cautionWidgets = ["run-function", "send-to-flex", "run-subflow"];
    this.serverlessSid = [];
    this.serverless = {};
    this.taskrouter = {};
  }

  async getFlow() {
    const result = await this.client.studio.v2.flows(this.sid).fetch();

    this.dateUpdated = result.dateUpdated;
    this.dateCreated = result.dateCreated;
    this.jFlow = result;
    // this.trataFlow();

    const arrPromises = [];

    const serverlessSidTemp = await this.client.serverless.v1.services.list();
    this.serverlessSid = serverlessSidTemp.map((service) => {
      return service.sid;
    });
    // this.serverlessSid = this.serverlessSid.filter((servicesid) => {
    //   return servicesid !== undefined;
    // });

    this.serverlessSid.map(async (serverless_sid) => {
      const pro = new Promise(async (resolve, reject) => {
        this.client.serverless.v1
          .services(serverless_sid)
          .fetch()
          .then((serverlessResult) => {
            this.client.serverless.v1
              .services(serverless_sid)
              .environments.list()
              .then((environmentsResult) => {
                this.client.serverless.v1
                  .services(serverless_sid)
                  .functions.list()
                  .then((functionsResult) => {
                    var ServerlessClass = new Serverless(
                      serverlessResult.sid,
                      serverlessResult.friendlyName,
                      serverlessResult.domainBase,
                      serverlessResult.dateCreated,
                      serverlessResult.dateUpdated,
                      functionsResult,
                      environmentsResult
                    );
                    ServerlessClass.trataEnvironments();
                    ServerlessClass.trataFunctions();

                    this.serverless[serverless_sid] =
                      ServerlessClass;

                    this.client.taskrouter.v1.workspaces
                      .list({ limit: 20 })
                      .then((workspacesResult) => {
                        if (workspacesResult.length > 0) {

                          this.client.taskrouter.v1
                            .workspaces(workspacesResult[0].sid)
                            .workflows.list({ limit: 20 })
                            .then((workFlowResult) => {
                              this.client.taskrouter.v1
                                .workspaces(workspacesResult[0].sid)
                                .taskChannels.list({ limit: 20 })
                                .then((channelsResult) => {
                                  this.taskrouter = new Taskrouter(
                                    workspacesResult[0].sid
                                  );
                                  this.taskrouter.trataWorkflows(workFlowResult);
                                  this.taskrouter.trataTaskChannels(
                                    channelsResult
                                  );
                                  resolve();
                                })
                                .catch((channelsResultError) => {
                                  console.log(
                                    "channelsResultError",
                                    channelsResultError
                                  );
                                  reject(channelsResultError);
                                });
                            })
                            .catch((workFlowResultError) => {
                              console.log(
                                "workFlowResultError",
                                workFlowResultError
                              );
                              reject(workFlowResultError);
                            });
                        } else {
                          resolve();

                        }
                      })
                      .catch((workspacesResultError) => {
                        console.log(
                          "workspacesResultError",
                          workspacesResultError
                        );
                        reject(workspacesResultError);
                      });
                  })
                  .catch((functionsResultError) => {
                    console.log("functionsResultError", functionsResultError);
                    reject(functionsResultError);
                  });
              })
              .catch((serverlessResultError) => {
                console.log("serverlessResultError", serverlessResultError);
                reject(serverlessResultError);
              });
          });
      });

      arrPromises.push(pro);
    });

    await Promise.all(arrPromises);
  }

  // trataFlow() {
  //   this.changePoints = this.jFlow.filter((widget) => {
  //     if (this.cautionWidgets.includes(widget.type)) {
  //       return true;
  //     }
  //   });
  //   this.changePoints.map((runFunction) => {
  //     if (!this.serverlessSid.includes(runFunction.properties.service_sid)) {
  //       this.serverlessSid.push(runFunction.properties.service_sid);
  //     }
  //   });
  // }
}

module.exports = Flow;
