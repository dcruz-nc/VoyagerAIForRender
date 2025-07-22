 document.getElementById('contact-form').addEventListener('submit', async function (e) {
  e.preventDefault();

  const form = e.target;
  const formData = {
    name: form.name.value.trim(),
    email: form.email.value.trim(),
    subject: form.subject.value.trim(),
    message: form.message.value.trim(),
  };

  try {
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    const result = await response.json();

    if (result.success) {
      alert('Message sent successfully!');
      form.reset();
    } else {
      alert('Failed to send message. Please try again later.');
    }
  } catch (error) {
    alert('An error occurred while sending your message.');
    console.error(error);
  }
});


document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.faq-question').forEach(button => {
    button.addEventListener('click', () => {
      const expanded = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', !expanded);
      const answer = button.nextElementSibling;
      if (expanded) {
        answer.hidden = true;
      } else {
        answer.hidden = false;
      }
    });
  });
});


// Toggle chat visibility
document.getElementById('chat-toggle').addEventListener('click', () => {
  const chatBox = document.getElementById('chat-box');
  chatBox.style.display = chatBox.style.display === 'flex' ? 'none' : 'flex';
});

// Send message to OpenAI backend
document.getElementById('chat-send-btn').addEventListener('click', async () => {
  const input = document.getElementById('user-input');
  const message = input.value.trim();
  if (!message) return;

  appendMessage('You', message);
  input.value = '';
  appendMessage('VoyagerAi', 'Typing...');

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });

    const data = await response.json();
    document.getElementById('chat-messages').lastChild.remove(); // Remove "Typing..."
    appendMessage('VoyagerAi', data.reply);
  } catch (err) {
    console.error('Chat error:', err);
    appendMessage('VoyagerAi', 'Something went wrong. Try again later.');
  }
});

function appendMessage(sender, text) {
  const container = document.getElementById('chat-messages');
  const messageElem = document.createElement('div');
  messageElem.textContent = `${sender}: ${text}`;
  container.appendChild(messageElem);
  container.scrollTop = container.scrollHeight;
}
