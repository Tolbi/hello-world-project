
/**
 * Service pour interagir avec Google Picker API
 */

const getCredentials = () => {
  const clean = (val: string | null) => (val || '').replace(/\s/g, '');
  return {
    clientId: clean(localStorage.getItem('agrisense_google_client_id')),
    apiKey: clean(localStorage.getItem('agrisense_google_api_key')),
    projectNumber: clean(localStorage.getItem('agrisense_google_project_number'))
  };
};

const SCOPES = 'https://www.googleapis.com/auth/drive.file';

let accessToken: string | null = null;
let tokenClient: any = null;
let pickerInited = false;

const waitForGoogleScripts = () => {
  return new Promise<void>((resolve, reject) => {
    const maxAttempts = 50;
    let attempts = 0;

    const check = () => {
      // @ts-ignore
      if (window.gapi && window.google && window.google.accounts) {
        resolve();
      } else if (attempts < maxAttempts) {
        attempts++;
        setTimeout(check, 100);
      } else {
        reject("Google SDK scripts failed to load in time.");
      }
    };
    check();
  });
};

export const initGoogleDrive = async () => {
  const { clientId } = getCredentials();
  if (!clientId) return Promise.resolve();

  try {
    await waitForGoogleScripts();
    
    // @ts-ignore
    const gapi = window.gapi;

    if (!pickerInited) {
      await new Promise<void>((resolve) => {
        gapi.load('picker', () => {
          pickerInited = true;
          resolve();
        });
      });
    }

    // @ts-ignore
    const google = window.google;
    if (google && google.accounts && !tokenClient) {
      tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPES,
        callback: (response: any) => {
          // Callback géré dynamiquement dans openPicker
        },
      });
    }
    
    return Promise.resolve();
  } catch (error) {
    console.error("Failed to initialize Google Drive:", error);
    throw error;
  }
};

export const openPicker = (onSelect: (file: any) => void) => {
  const { clientId, apiKey, projectNumber } = getCredentials();
  
  if (!clientId || !apiKey || !projectNumber) {
    alert("Veuillez configurer l'ID Client, la Clé API et le Numéro de Projet.");
    return;
  }

  // @ts-ignore
  const google = window.google;
  if (!google || !google.picker) {
     console.error("Google Picker not loaded");
     return;
  }

  const createPicker = (token: string) => {
    try {
      const view = new google.picker.DocsView(google.picker.ViewId.DOCS);
      
      const picker = new google.picker.PickerBuilder()
        .enableFeature(google.picker.Feature.NAV_HIDDEN)
        .setDeveloperKey(apiKey)
        .setAppId(projectNumber)
        .setOAuthToken(token)
        .addView(view)
        .setCallback((data: any) => {
          if (data.action === google.picker.Action.PICKED) {
            if (data.docs && data.docs.length > 0) {
              onSelect(data.docs[0]);
            }
          }
        })
        .build();
      picker.setVisible(true);
    } catch (err) {
      console.error("Error building picker:", err);
      alert("Erreur lors de l'ouverture du sélecteur Google Drive.");
    }
  };

  if (!tokenClient) {
    initGoogleDrive().then(() => openPicker(onSelect)).catch(e => console.error(e));
    return;
  }

  tokenClient.callback = async (response: any) => {
    if (response.error !== undefined) {
      console.error("Erreur d'autorisation Google (GIS):", response);
      alert(`Erreur Google : ${response.error_description || response.error}`);
      return;
    }
    accessToken = response.access_token;
    createPicker(accessToken!);
  };

  try {
    tokenClient.requestAccessToken({ prompt: 'select_account' });
  } catch (err) {
    console.error("Request access token failed:", err);
  }
};
