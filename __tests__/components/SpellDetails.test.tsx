/// <reference types="@testing-library/jest-dom" />
/**
 * Testes para componentes da Biblioteca
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import SpellDetails from '@/components/biblioteca/SpellDetails';
import { Spell } from '@/types';

const mockSpell: Spell = {
  id: '1',
  name: 'Fireball',
  level: 3,
  school: 'Evocation',
  castingTime: '1 action',
  range: '150 feet',
  components: ['V', 'S', 'M'],
  duration: 'Instantaneous',
  description: 'A bright streak flashes from your pointing finger to a point',
  ritual: false,
  concentration: false,
};

describe('SpellDetails', () => {
  it('should render spell details correctly', () => {
    render(
      <SpellDetails
        spell={mockSpell}
        onClose={() => {}}
      />
    );

    expect(screen.getByText('Fireball')).toBeInTheDocument();
    expect(screen.getByText(/Nível 3/)).toBeInTheDocument();
    expect(screen.getByText(/Evocation/)).toBeInTheDocument();
  });

  it('should render null when spell is null', () => {
    const { container } = render(
      <SpellDetails
        spell={null}
        onClose={() => {}}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should display spell components', () => {
    render(
      <SpellDetails
        spell={mockSpell}
        onClose={() => {}}
      />
    );

    expect(screen.getByText(/V, S, M/)).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    const onClose = jest.fn();
    render(
      <SpellDetails
        spell={mockSpell}
        onClose={onClose}
      />
    );

    const closeButton = screen.getByText('✕');
    closeButton.click();

    expect(onClose).toHaveBeenCalled();
  });

  it('should show ritual indicator when spell is ritual', () => {
    const ritualSpell = { ...mockSpell, ritual: true };
    render(
      <SpellDetails
        spell={ritualSpell}
        onClose={() => {}}
      />
    );

    expect(screen.getByText(/Ritual/)).toBeInTheDocument();
  });
});
