(function () {
  const forms = Array.from(document.querySelectorAll("[data-contact-form]"));

  forms.forEach((form) => {
    const status = form.querySelector("[data-contact-status]");

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      if (!form.reportValidity()) {
        return;
      }

      const formData = new FormData(form);
      if (String(formData.get("website") || "").trim()) {
        setStatus(status, "Thanks. Your message has been received.");
        form.reset();
        return;
      }

      const recipient = String(form.dataset.contactEmail || "").trim();
      if (!recipient) {
        setStatus(status, "Contact email is not configured yet.");
        return;
      }

      const firstName = cleanValue(formData.get("first-name"));
      const lastName = cleanValue(formData.get("last-name"));
      const senderEmail = cleanValue(formData.get("email"));
      const message = cleanMessage(formData.get("message"));
      const fullName = [firstName, lastName].filter(Boolean).join(" ") || "Website visitor";
      const subject = `Symmetric Vision inquiry from ${fullName}`;
      const body = [
        `Name: ${fullName}`,
        `Email: ${senderEmail}`,
        "",
        "Message:",
        message
      ].join("\n");

      setStatus(status, "Opening your email app...");
      window.location.href = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    });
  });

  function cleanValue(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function cleanMessage(value) {
    return String(value || "")
      .replace(/\r\n/g, "\n")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{4,}/g, "\n\n\n")
      .trim();
  }

  function setStatus(status, message) {
    if (status) {
      status.textContent = message;
    }
  }
})();
