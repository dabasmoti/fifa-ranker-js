import React from 'react';

export const Table = ({ children, className, ...props }) => (
  <table className={`min-w-full divide-y divide-gray-200 ${className}`} {...props}>
    {children}
  </table>
);

export const TableHeader = ({ children, className, ...props }) => (
  <thead className={className} {...props}>{children}</thead>
);

export const TableHead = ({ children, className, ...props }) => (
  <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${className}`} {...props}>
    {children}
  </th>
);

export const TableBody = ({ children, className, ...props }) => (
  <tbody className={className} {...props}>{children}</tbody>
);

export const TableRow = ({ children, className, ...props }) => (
  <tr className={className} {...props}>{children}</tr>
);

export const TableCell = ({ children, className, ...props }) => (
  <td className={`px-6 py-4 whitespace-nowrap ${className}`} {...props}>
    {children}
  </td>
); 