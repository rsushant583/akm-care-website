import { Component, type ErrorInfo, type ReactNode } from "react";
import { Link } from "react-router-dom";

type Props = { children: ReactNode; title?: string };
type State = { hasError: boolean; message: string };

/** Prevents a checkout/auth crash from becoming a blank white screen. */
export class RouteErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error?.message || "Something went wrong.",
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[RouteErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <section className="section-padding bg-[#FAF8F5] min-h-[50vh]">
        <div className="container-premium max-w-lg mx-auto text-center rounded-2xl border border-black/[0.06] bg-white p-8">
          <h1 className="font-heading text-2xl mb-2">{this.props.title || "We hit a snag"}</h1>
          <p className="text-sm text-[#6B6B6B] mb-2">
            Your cart and progress were kept. You can retry or go back safely.
          </p>
          {this.state.message ? (
            <p className="text-xs text-[#6B6B6B] mb-6 break-words">{this.state.message}</p>
          ) : null}
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, message: "" })}
              className="rounded-full bg-[#E8621A] text-white font-semibold px-5 py-2.5 text-sm min-h-11"
            >
              Try again
            </button>
            <Link
              to="/cart"
              className="rounded-full border border-black/10 px-5 py-2.5 text-sm font-semibold min-h-11 inline-flex items-center"
            >
              Back to cart
            </Link>
            <Link
              to="/shop"
              className="rounded-full border border-black/10 px-5 py-2.5 text-sm font-semibold min-h-11 inline-flex items-center"
            >
              Continue shopping
            </Link>
          </div>
        </div>
      </section>
    );
  }
}
