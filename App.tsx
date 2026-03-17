import { Provider as PaperProvider } from "react-native-paper";
import Navigation from "./app/Navigation";
import { theme } from "./ui/Theme";

export default function App() {
  return (
    <PaperProvider theme={theme}>
      <Navigation />
    </PaperProvider>
  );
}