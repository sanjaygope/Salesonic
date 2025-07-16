import React, { useState } from 'react';
import { AppProvider, Page, Card, Form, FormLayout, TextField, Button, Textarea, Select } from '@shopify/polaris';
import '@shopify/polaris/build/esm/styles.css';

function App() {
  const [agentName, setAgentName] = useState('');
  const [description, setDescription] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [initialMessage, setInitialMessage] = useState('');
  const [voiceId, setVoiceId] = useState('');
  const [language, setLanguage] = useState('en');
  const [llm, setLlm] = useState('gpt-4');
  const [knowledgeBase, setKnowledgeBase] = useState('');
  const [mcp, setMcp] = useState('');
  const [agentId, setAgentId] = useState('');

  const handleCreateAgent = async () => {
    const agentConfig = {
      name: agentName,
      description,
      systemPrompt,
      initialMessage,
      voiceId,
      language,
      llm,
      knowledgeBase,
      mcp,
    };

    const response = await fetch('/api/create-agent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(agentConfig),
    });

    const data = await response.json();
    setAgentId(data.id);
  };

  const handleDeployAgent = async () => {
    await fetch('/api/embed-agent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ agentId }),
    });
  };

  return (
    <AppProvider i18n={{}}>
      <Page title="Create AI Agent">
        <Card>
          <Card.Section>
            <Form onSubmit={handleCreateAgent}>
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
                <Select
                  label="Language"
                  options={[
                    { label: 'English', value: 'en' },
                    { label: 'Spanish', value: 'es' },
                  ]}
                  onChange={(value) => setLanguage(value)}
                  value={language}
                />
                <Select
                  label="LLM"
                  options={[
                    { label: 'GPT-4', value: 'gpt-4' },
                    { label: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo' },
                  ]}
                  onChange={(value) => setLlm(value)}
                  value={llm}
                />
                <TextField
                  label="Knowledge Base"
                  value={knowledgeBase}
                  onChange={(value) => setKnowledgeBase(value)}
                />
                <Textarea
                  label="Model Context Protocol (MCP)"
                  value={mcp}
                  onChange={(value) => setMcp(value)}
                />
                <Button submit>Create Agent</Button>
              </FormLayout>
            </Form>
          </Card.Section>
          {agentId && (
            <Card.Section>
              <Button onClick={handleDeployAgent}>Deploy Agent</Button>
            </Card.Section>
          )}
        </Card>
      </Page>
    </AppProvider>
  );
}

export default App;