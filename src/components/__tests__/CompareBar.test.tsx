import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import CompareBar, { CompareCheckbox } from "../CompareBar";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

describe("CompareBar", () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it("renders children with selection helpers", () => {
    render(
      <CompareBar>
        {({ isSelected, toggleSelection }) => (
          <div>
            <span data-testid="selected-p1">{isSelected("p1") ? "yes" : "no"}</span>
            <button onClick={() => toggleSelection("p1", "Zeka")}>Toggle</button>
          </div>
        )}
      </CompareBar>
    );

    expect(screen.getByTestId("selected-p1")).toHaveTextContent("no");
  });

  it("toggles selection and shows compare bar", () => {
    render(
      <CompareBar>
        {({ isSelected, toggleSelection }) => (
          <div>
            <button onClick={() => toggleSelection("p1", "Zeka")}>Toggle P1</button>
            <button onClick={() => toggleSelection("p2", "Yike")}>Toggle P2</button>
          </div>
        )}
      </CompareBar>
    );

    fireEvent.click(screen.getByText("Toggle P1"));
    expect(screen.getByText("1/2 selected")).toBeInTheDocument();
    expect(screen.getByText("Zeka")).toBeInTheDocument();
  });

  it("limits selection to 2 players", () => {
    render(
      <CompareBar>
        {({ toggleSelection }) => (
          <div>
            <button onClick={() => toggleSelection("p1", "A")}>A</button>
            <button onClick={() => toggleSelection("p2", "B")}>B</button>
            <button onClick={() => toggleSelection("p3", "C")}>C</button>
          </div>
        )}
      </CompareBar>
    );

    fireEvent.click(screen.getByText("A"));
    fireEvent.click(screen.getByText("B"));
    fireEvent.click(screen.getByText("C"));

    expect(screen.getByText("2/2 selected")).toBeInTheDocument();
    // The compare bar should only show A, B — not C
    const barNames = screen.getByText(/A vs B/);
    expect(barNames).toBeInTheDocument();
  });

  it("deselects on second toggle", () => {
    render(
      <CompareBar>
        {({ isSelected, toggleSelection }) => (
          <div>
            <span data-testid="status">{isSelected("p1") ? "selected" : "not"}</span>
            <button onClick={() => toggleSelection("p1", "Zeka")}>Toggle</button>
          </div>
        )}
      </CompareBar>
    );

    fireEvent.click(screen.getByText("Toggle"));
    expect(screen.getByTestId("status")).toHaveTextContent("selected");

    fireEvent.click(screen.getByText("Toggle"));
    expect(screen.getByTestId("status")).toHaveTextContent("not");
    expect(screen.queryByText("1/2 selected")).not.toBeInTheDocument();
  });

  it("navigates to compare page with exactly 2 players", () => {
    render(
      <CompareBar>
        {({ toggleSelection }) => (
          <div>
            <button onClick={() => toggleSelection("p1", "Zeka")}>P1</button>
            <button onClick={() => toggleSelection("p2", "Yike")}>P2</button>
          </div>
        )}
      </CompareBar>
    );

    fireEvent.click(screen.getByText("P1"));
    fireEvent.click(screen.getByText("P2"));

    const compareBtn = screen.getByText("Compare");
    expect(compareBtn).not.toBeDisabled();

    fireEvent.click(compareBtn);
    expect(mockPush).toHaveBeenCalledWith("/compare?players=p1,p2");
  });

  it("disables compare button with < 2 players", () => {
    render(
      <CompareBar>
        {({ toggleSelection }) => (
          <button onClick={() => toggleSelection("p1", "Zeka")}>Toggle</button>
        )}
      </CompareBar>
    );

    fireEvent.click(screen.getByText("Toggle"));
    const compareBtn = screen.getByText("Compare");
    expect(compareBtn).toBeDisabled();
  });

  it("clears all selections", () => {
    render(
      <CompareBar>
        {({ toggleSelection }) => (
          <div>
            <button onClick={() => toggleSelection("p1", "Zeka")}>Toggle</button>
          </div>
        )}
      </CompareBar>
    );

    fireEvent.click(screen.getByText("Toggle"));
    expect(screen.getByText("1/2 selected")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Clear"));
    expect(screen.queryByText("1/2 selected")).not.toBeInTheDocument();
  });
});

describe("CompareCheckbox", () => {
  it("renders checkbox with label", () => {
    const toggle = vi.fn();
    render(
      <CompareCheckbox
        playerId="p1"
        playerName="Zeka"
        isSelected={false}
        toggleSelection={toggle}
      />
    );
    expect(screen.getByText("Compare")).toBeInTheDocument();
  });

  it("calls toggleSelection on change", () => {
    const toggle = vi.fn();
    render(
      <CompareCheckbox
        playerId="p1"
        playerName="Zeka"
        isSelected={false}
        toggleSelection={toggle}
      />
    );
    fireEvent.click(screen.getByRole("checkbox"));
    expect(toggle).toHaveBeenCalledWith("p1", "Zeka");
  });
});
