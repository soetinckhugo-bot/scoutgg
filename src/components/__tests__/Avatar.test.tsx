import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Avatar from "../Avatar";

vi.mock("next/image", () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string; [k: string]: unknown }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...props} />
  ),
}));

describe("Avatar", () => {
  it("renders image when src is provided", () => {
    render(<Avatar src="/photo.jpg" alt="Zeka" fallback="Z" />);
    const img = screen.getByAltText("Zeka");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "/photo.jpg");
  });

  it("renders fallback initial when src is null", () => {
    render(<Avatar src={null} alt="Zeka" fallback="Zeka" />);
    expect(screen.getByText("Z")).toBeInTheDocument();
  });

  it("applies correct size class", () => {
    const { container } = render(<Avatar src={null} alt="A" fallback="A" size="xl" />);
    const div = container.querySelector("div");
    expect(div).toHaveClass("w-14", "h-14", "text-xl");
  });

  it("has aria-label for accessibility", () => {
    render(<Avatar src={null} alt="Zeka" fallback="Zeka" />);
    expect(screen.getByLabelText("Avatar de Zeka")).toBeInTheDocument();
  });
});
