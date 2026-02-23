import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
let promptsContent: string | null = null;

function loadPrompts(): string {
  if (!promptsContent) {
    promptsContent = readFileSync(
      resolve(__dirname, '../../../../config/voice-prompts.md'),
      'utf-8'
    );
  }
  return promptsContent;
}

function extractPrompt(sectionTitle: string): string {
  const content = loadPrompts();
  const regex = new RegExp(
    `## ${sectionTitle}[\\s\\S]*?\`\`\`\\n([\\s\\S]*?)\`\`\``,
    'i'
  );
  const match = content.match(regex);
  return match?.[1]?.trim() || '';
}

export function renderTemplate(
  template: string,
  variables: Record<string, string | number>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return String(variables[key] ?? `{{${key}}}`);
  });
}

export function getCoreSystemPrompt(variables: Record<string, string | number>): string {
  const template = extractPrompt('Core System Prompt');
  return renderTemplate(template, variables);
}

export function getIntentClassificationPrompt(message: string): string {
  const template = extractPrompt('Intent Classification Prompt');
  return renderTemplate(template, { message });
}

export function getIntakeInitialPrompt(): string {
  return extractPrompt('Initial Gathering');
}

export function getIntakeConfirmationPrompt(
  variables: Record<string, string>
): string {
  const template = extractPrompt('Confirmation');
  return renderTemplate(template, variables);
}

export function getIntakePostSavePrompt(
  variables: Record<string, string>
): string {
  const template = extractPrompt('Post-Save');
  return renderTemplate(template, variables);
}

export function getContactIdentificationPrompt(): string {
  return extractPrompt('Contact Identification');
}

export function getCaptureDetailsPrompt(): string {
  return extractPrompt('Capture Details');
}
