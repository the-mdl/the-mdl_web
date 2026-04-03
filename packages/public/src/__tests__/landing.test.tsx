import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LandingPage } from '../pages/landing';

function renderLanding() {
  return render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>,
  );
}

describe('LandingPage', () => {
  it('renders brand name "the mdl"', () => {
    renderLanding();
    const headings = screen.getAllByText('the mdl');
    expect(headings.length).toBeGreaterThanOrEqual(1);
  });

  it('renders primary tagline', () => {
    renderLanding();
    expect(screen.getByText('Find the middle ground.')).toBeInTheDocument();
  });

  it('has CTA links to /account and /download', () => {
    renderLanding();
    const getStarted = screen.getByRole('link', { name: /get started/i });
    expect(getStarted).toHaveAttribute('href', '/account');
    const download = screen.getByRole('link', { name: /^download$/i });
    expect(download).toHaveAttribute('href', '/download');
  });

  it('renders Mirror · Digest · Learn text', () => {
    renderLanding();
    const headings = screen.getAllByRole('heading', { level: 3 });
    const headingTexts = headings.map((h) => h.textContent);
    expect(headingTexts).toContain('Mirror');
    expect(headingTexts).toContain('Digest');
    expect(headingTexts).toContain('Learn');
  });
});
