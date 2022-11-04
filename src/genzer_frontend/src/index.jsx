import * as React from "react";
import { render } from "react-dom";
import App from "./App";
import { MantineProvider } from '@mantine/core';
import { BrowserRouter, HashRouter } from "react-router-dom";
import { NotificationsProvider } from "@mantine/notifications";


render(<MantineProvider withGlobalStyles withNormalizeCSS>
  <NotificationsProvider position="top-right" zIndex={2077}>
    <HashRouter>
      <App />
    </HashRouter>
  </NotificationsProvider>
</MantineProvider>,
  document.getElementById("app")
);
