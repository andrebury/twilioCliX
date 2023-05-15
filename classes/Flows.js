const prompts = require("prompts");
const Flow = require("./Flow");
const jsonNewFlow = require("./JsonNewFlow")

class Flows {
  constructor(nomeAccount) {
    this.nomeAccount = nomeAccount;
    this.flows = [];
    this.selectedFlow = "";
    this.flow = {};
    this.newFlow = {}
  }

  async getSelectedFlow() {
    const choices = this.flows.map((flow) => {
      return {
        title: flow.friendlyName,
        value: { friendlyName: flow.friendlyName, sid: flow.sid },
      };
    });

    const escolha = await prompts({
      type: "select",
      name: "value",
      message: "Selecione o Flow de " + this.nomeAccount,
      choices,
      initial: 0,
    });
    this.selectedFlow = escolha.value;
  }

  async updateFlows(client, newFlow) {
    const commitMessage = await prompts({
      type: 'text',
      name: 'value',
      message: 'Qual a commit message?'
    });

    await client.studio.v2.flows(this.selectedFlow.sid).update({
      commitMessage: commitMessage.value, definition: newFlow, status: 'published'
    });
  }

  async createFlow(client) {
    const newFlowName = await prompts(
      [{
        type: 'text',
        name: 'nomeFlow',
        message: 'Qual o nome do novo Flow?'
      }, {
        type: 'text',
        name: 'commitMessage',
        message: 'Qual a commit Message?'
      }, {
        type: 'text',
        name: 'description',
        message: 'Qual a descrição do Flow?'
      }]);
    const { nomeFlow, commitMessage, description } = newFlowName

    try {
      const newFlowObject = await client.studio.v2.flows.create(
        jsonNewFlow.flowJson(nomeFlow, commitMessage, description)
      );
      this.selectedFlow = { friendlyName: nomeFlow, sid: newFlowObject.sid }
    } catch (error) {
      console.error('Erro na criação do flow', error)
    }
  }

  async getNewFlow(client) {
    await this.createFlow(client)

    const flow = new Flow(
      this.selectedFlow.friendlyName,
      this.selectedFlow.sid,
      client
    );
    await flow.getFlow();
    this.flow = flow;
  }

  async getFlows(client) {
    this.flows = await client.studio.v2.flows.list();
    const response = await this.getSelectedFlow();
    const flow = new Flow(
      this.selectedFlow.friendlyName,
      this.selectedFlow.sid,
      client
    );
    await flow.getFlow();

    this.flow = flow;
  }
}
module.exports = Flows;
