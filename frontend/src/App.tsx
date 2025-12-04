import { Button } from "@/components/ui/button"
import { FaRocket, FaRobot, FaCode } from "react-icons/fa"

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl">
            <FaRocket className="text-primary" />
            <span>Nova AI</span>
          </div>
          <nav className="flex gap-4">
            <Button variant="ghost">Features</Button>
            <Button variant="ghost">Pricing</Button>
            <Button variant="ghost">About</Button>
            <Button>Get Started</Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="py-24 px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6">
            Build the Future with <span className="text-primary">Nova AI</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            The ultimate AI-powered platform for modern developers.
            Accelerate your workflow and ship faster than ever.
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg">Start Building</Button>
            <Button size="lg" variant="outline">Learn More</Button>
          </div>
        </section>

        <section className="py-16 bg-muted/50">
          <div className="container mx-auto px-4 grid md:grid-cols-3 gap-8">
            <div className="p-6 bg-card rounded-lg shadow-sm border">
              <FaRobot className="text-4xl text-primary mb-4" />
              <h3 className="text-xl font-bold mb-2">AI Powered</h3>
              <p className="text-muted-foreground">Advanced algorithms to assist your coding journey.</p>
            </div>
            <div className="p-6 bg-card rounded-lg shadow-sm border">
              <FaCode className="text-4xl text-primary mb-4" />
              <h3 className="text-xl font-bold mb-2">Clean Code</h3>
              <p className="text-muted-foreground">Generate production-ready code with best practices.</p>
            </div>
            <div className="p-6 bg-card rounded-lg shadow-sm border">
              <FaRocket className="text-4xl text-primary mb-4" />
              <h3 className="text-xl font-bold mb-2">Lightning Fast</h3>
              <p className="text-muted-foreground">Optimized performance for the best user experience.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8 text-center text-muted-foreground">
        <p>&copy; 2024 Nova AI. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default App
