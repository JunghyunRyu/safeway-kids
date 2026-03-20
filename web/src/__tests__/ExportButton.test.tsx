import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExportButton from '../components/ExportButton';

describe('ExportButton', () => {
  const columns = [
    { key: 'name', label: '이름' },
    { key: 'age', label: '나이' },
  ];

  const data = [
    { name: '김철수', age: 10 },
    { name: '이영희', age: 11 },
  ];

  it('renders export button', () => {
    render(<ExportButton data={data} columns={columns} filename="test" />);

    expect(screen.getByRole('button', { name: /CSV 내보내기/i })).toBeInTheDocument();
  });

  it('is disabled when data is empty', () => {
    render(<ExportButton data={[]} columns={columns} filename="test" />);

    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('creates download on click', async () => {
    const mockUrl = 'blob:http://localhost/mock';
    const createObjectURL = vi.fn(() => mockUrl);
    const revokeObjectURL = vi.fn();
    global.URL.createObjectURL = createObjectURL;
    global.URL.revokeObjectURL = revokeObjectURL;

    // Mock HTMLAnchorElement.click to prevent navigation
    const clickSpy = vi.fn();
    const origClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = clickSpy;

    render(<ExportButton data={data} columns={columns} filename="export" />);
    await userEvent.click(screen.getByRole('button'));

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith(mockUrl);

    HTMLAnchorElement.prototype.click = origClick;
  });
});
