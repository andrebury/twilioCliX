class JsonNewFlow {

  flowJson(friendlyName, description, commitMessage) {
    return {
      commitMessage,
      friendlyName,
      status: 'draft',
      definition: {
        description,
        states: [
          {
            name: 'Trigger',
            type: 'trigger',
            transitions: [
            ],
            properties: {
              offset: {
                x: 0,
                y: 0
              }
            }
          }
        ],
        initial_state: 'Trigger',
        flags: {
          allow_concurrent_calls: true
        }
      }
    }

  }
}
module.exports = new JsonNewFlow();

