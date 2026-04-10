import { SEO } from "@/components/SEO";

export default function Disclaimer() {
  return (
    <>
      <SEO
        title="Disclaimer — AKM Care & AKM Freight"
        description="Read AKM Care & AKM Freight disclaimer, service limitations, product information, legal notices, and jurisdiction details."
        canonical="/disclaimer"
      />
      <section className="section-padding bg-warm-beige">
        <div className="container-premium text-center max-w-3xl">
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl mb-6">Disclaimer</h1>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-premium max-w-3xl prose prose-lg">
          <div className="space-y-10">
            <div>
              <h2 className="font-heading text-2xl mb-4">1. General Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                The information provided on this website is for general informational purposes only. AKM Care & AKM Freight makes every effort to keep the information up to date and correct. However, we make no representations or warranties of any kind, express or implied, about the completeness, accuracy, reliability, suitability, or availability of the information, products, services, or related graphics contained on the website.
              </p>
            </div>

            <div>
              <h2 className="font-heading text-2xl mb-4">2. Service Disclaimer</h2>
              <p className="text-muted-foreground leading-relaxed">
                All services offered by AKM Care & AKM Freight are subject to availability, terms, and conditions as agreed upon with individual clients. Service scope, pricing, and delivery timelines may vary based on specific project requirements and are finalized through formal agreements.
              </p>
            </div>

            <div>
              <h2 className="font-heading text-2xl mb-4">3. External Links</h2>
              <p className="text-muted-foreground leading-relaxed">
                This website may contain links to external websites that are not provided or maintained by AKM Care & AKM Freight. We do not guarantee the accuracy, relevance, timeliness, or completeness of any information on these external websites.
              </p>
            </div>

            <div>
              <h2 className="font-heading text-2xl mb-4">4. Product Disclaimer</h2>
              <p className="text-muted-foreground leading-relaxed">
                Products listed on our e-commerce section are sourced from rural Indian villages. While we strive to maintain quality, product availability, pricing, and specifications may change without prior notice. Product images are representative and actual products may vary slightly.
              </p>
            </div>

            <div>
              <h2 className="font-heading text-2xl mb-4">5. Liability Limitation</h2>
              <p className="text-muted-foreground leading-relaxed">
                In no event will AKM Care & AKM Freight be liable for any loss or damage including without limitation, indirect or consequential loss or damage, arising out of or in connection with the use of this website or our services.
              </p>
            </div>

            <div>
              <h2 className="font-heading text-2xl mb-4">6. Contact for Queries</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about this disclaimer or our services, please contact us at akmcare108@gmail.com or call +91-8200224226.
              </p>
            </div>

            <div className="bg-accent rounded-2xl p-6">
              <p className="text-foreground font-medium leading-relaxed">
                In case of any legal dispute, redressal will be in Ahmedabad, Gujarat Jurisdiction.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
