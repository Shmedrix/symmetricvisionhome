(function () {
  const forms = Array.from(document.querySelectorAll("[data-contact-form]"));

  forms.forEach((form) => {
    const status = form.querySelector("[data-contact-status]");
    const submitButton = form.querySelector("[type='submit']");

    if (new URLSearchParams(window.location.search).get("sent") === "true") {
      setStatus(status, "Thanks. Your message has been sent.", "success");
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (!form.reportValidity()) {
        return;
      }

      const formData = new FormData(form);
      if (String(formData.get("website") || "").trim()) {
        setStatus(status, "Thanks. Your message has been sent.", "success");
        form.reset();
        return;
      }

      const firstName = cleanValue(formData.get("first_name"));
      const lastName = cleanValue(formData.get("last_name"));
      const fullName = [firstName, lastName].filter(Boolean).join(" ") || "Website visitor";
      formData.set("name", fullName);
      formData.delete("website");

      setSending(submitButton, true);
      setStatus(status, "Sending...", "");

      try {
        const response = await fetch(form.action, {
          method: form.method || "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
          },
          body: JSON.stringify(Object.fromEntries(formData))
        });
        const result = await response.json().catch(() => ({}));

        if (!response.ok || result.success === false) {
          throw new Error(result.message || "Message could not be sent.");
        }

        form.reset();
        setStatus(status, "Thanks. Your message has been sent.", "success");
      } catch (error) {
        setStatus(status, error.message || "Message could not be sent. Please try again.", "error");
      } finally {
        setSending(submitButton, false);
      }
    });
  });

  function cleanValue(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function setSending(button, isSending) {
    if (!button) {
      return;
    }

    button.disabled = isSending;
    button.textContent = isSending ? "Sending..." : "Submit";
  }

  function setStatus(status, message, state) {
    if (status) {
      status.textContent = message;
      status.dataset.state = state || "";
    }
  }
})();
