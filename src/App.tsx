import { Switch, Route, Router as WouterRouter } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Room from "@/pages/room";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/room/:code" component={Room} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <TooltipProvider>
      <WouterRouter base="">
        <Router />
      </WouterRouter>
      <Toaster />
    </TooltipProvider>
  );
}

export default App;
