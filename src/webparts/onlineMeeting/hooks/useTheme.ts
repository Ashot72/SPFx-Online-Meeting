import { useEffect, useState } from "react";
import { WebPartContext } from "@microsoft/sp-webpart-base";
import {
  teamsDarkTheme,
  teamsHighContrastTheme,
  teamsTheme,
  ThemePrepared,
} from "@fluentui/react-northstar";

const useTheme = (context: WebPartContext): ThemePrepared => {
  const [theme, setTheme] = useState<ThemePrepared>(teamsTheme);

  useEffect(() => {
    const microsoftTeams = context.sdks.microsoftTeams;
    if (microsoftTeams) {
      microsoftTeams.teamsJs.app.getContext()
        .then((context) => {
          const theme = context.app.theme;

          switch (theme) {
            case "default":
              setTheme(teamsTheme);
              break;
            case "dark":
              setTheme(teamsDarkTheme);
              break;
            case "contrast":
              setTheme(teamsHighContrastTheme);
              break;
          }
        }).catch((e) => {
          console.log("Theme error:", e);
        });
    }
  }, []);

  return theme;
};

export default useTheme;
