import { useEffect, useState } from "react";
import { WebPartContext } from "@microsoft/sp-webpart-base";
import {
  teamsDarkTheme,
  teamsHighContrastTheme,
  teamsTheme,
  ThemePrepared,
} from "@fluentui/react-northstar";

const useRegisterTheme = (context: WebPartContext): ThemePrepared => {
  const [theme, setTheme] = useState(teamsTheme);

  useEffect(() => {
    const microsoftTeams = context.sdks.microsoftTeams;
    if (microsoftTeams) {
      microsoftTeams.teamsJs.app.registerOnThemeChangeHandler(
        (curTheme: string) => {
          switch (curTheme) {
            case "dark":
              setTheme(teamsDarkTheme);
              break;
            case "contrast":
              setTheme(teamsHighContrastTheme);
              break;
            default:
              setTheme(teamsTheme);
              break;
          }
        },
      );
    }
  }, []);

  return theme;
};

export default useRegisterTheme;
