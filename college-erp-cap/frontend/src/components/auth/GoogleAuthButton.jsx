import { useEffect, useMemo, useRef, useState } from "react";

const GOOGLE_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

const loadGoogleScript = () =>
  new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }

    const existing = document.querySelector(`script[src="${GOOGLE_SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Failed to load Google Sign-In script")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = GOOGLE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Sign-In script"));
    document.head.appendChild(script);
  });

export default function GoogleAuthButton({ onCredential, text = "continue_with", onError, disabled = false }) {
  const buttonRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  const clientId = useMemo(() => String(import.meta.env.VITE_GOOGLE_CLIENT_ID || "").trim(), []);

  useEffect(() => {
    let active = true;

    const setup = async () => {
      try {
        if (disabled) {
          setReady(false);
          setError("");
          return;
        }

        if (!clientId) {
          throw new Error("Google Client ID is not configured");
        }

        await loadGoogleScript();
        if (!active || !window.google?.accounts?.id || !buttonRef.current) return;

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (!response?.credential) {
              const credentialError = "Google credential was not received";
              setError(credentialError);
              if (onError) onError(credentialError);
              return;
            }
            setError("");
            onCredential(response.credential);
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        buttonRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(buttonRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          shape: "pill",
          width: 320,
          text,
          logo_alignment: "left",
        });

        setReady(true);
      } catch (err) {
        const msg = err?.message || "Google Sign-In is unavailable";
        setError(msg);
        if (onError) onError(msg);
      }
    };

    setup();

    return () => {
      active = false;
    };
  }, [clientId, disabled, onCredential, onError, text]);

  if (disabled) {
    return (
      <div className="google-auth-wrap">
        <button type="button" className="google-auth-fallback" disabled>
          Google Sign-In unavailable
        </button>
        <small className="google-auth-note">Set the Google client IDs to enable Google Sign-In.</small>
      </div>
    );
  }

  return (
    <div className="google-auth-wrap">
      <div ref={buttonRef} className="google-auth-btn" />
      {!ready && !error ? <small className="google-auth-note">Loading Google Sign-In...</small> : null}
      {error ? <small className="google-auth-error">{error}</small> : null}
    </div>
  );
}
