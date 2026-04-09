import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatterSelector } from '@/components/ChatterSelector';

const chatters = [
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' },
  { id: 3, name: 'Alex' },
];

describe('ChatterSelector', () => {
  it('renders selected name', () => {
    render(<ChatterSelector chatters={chatters} selectedId={1} onSelect={() => {}} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('filters by search query', async () => {
    const user = userEvent.setup();
    render(<ChatterSelector chatters={chatters} selectedId={null} onSelect={() => {}} />);
    await user.click(screen.getByRole('button'));
    const input = await screen.findByPlaceholderText(/поиск/i);
    await user.type(input, 'al');
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Alex')).toBeInTheDocument();
    expect(screen.queryByText('Bob')).not.toBeInTheDocument();
  });

  it('calls onSelect with id when item clicked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<ChatterSelector chatters={chatters} selectedId={null} onSelect={onSelect} />);
    await user.click(screen.getByRole('button'));
    await user.click(screen.getByText('Bob'));
    expect(onSelect).toHaveBeenCalledWith(2);
  });
});
