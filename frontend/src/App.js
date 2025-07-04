import React, { useState } from 'react';
import { Page, Card, Form, FormLayout, TextField, Button, Textarea } from '@shopify/polaris';

function App() {
  const [agentName, setAgentName] = useState('');
  const [description, setDescription] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [initialMessage, setInitialMessage] = useState('');
  const [voiceId, setVoiceId] = useState('');

  const handleSubmit = () => {
    const agentConfig = { 
      name: agentName, 
      description, 
      systemPrompt, 
      initialMessage, 
      voiceId 
    };
    console.log('Agent Configuration:', agentConfig);
    // Here you would send the agentConfig to your backend
  };

  return (
    <Page title="Create AI Agent">
      <Card>
        <Card.Section>
          <Form onSubmit={handleSubmit}>
            <FormLayout>
              <TextField
                label="Agent Name"
                value={agentName}
                onChange={(value) => setAgentName(value)}
              />
              <TextField
                label="Description"
                value={description}
                onChange={(value) => setDescription(value)}
              />
              <Textarea
                label="System Prompt"
                value={systemPrompt}
                onChange={(value) => setSystemPrompt(value)}
              />
              <Textarea
                label="Initial Message"
                value={initialMessage}
                onChange={(value) => setInitialMessage(value)}
              />
              <TextField
                label="Voice ID"
                value={voiceId}
                onChange={(value) => setVoiceId(value)}
              />
              <Button submit>Create Agent</Button>
            </FormLayout>
          </Form>
        </Card.Section>
      </Card>
    </Page>
  );
}

export default App;
