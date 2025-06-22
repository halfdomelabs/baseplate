import type { Meta, StoryObj } from '@storybook/react';

import { Button } from '../button/button.js';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from './table.js';

const meta = {
  component: Table,
  tags: ['autodocs'],
  argTypes: {},
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

interface User {
  id: number;
  name: string;
  email: string;
  lastLogin: Date;
}

const SAMPLE_USERS: User[] = [
  {
    id: 1,
    name: 'John Doe',
    email: 'johndoe@example.com',
    lastLogin: new Date('2023-05-30'),
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'janesmith@example.com',
    lastLogin: new Date('2023-05-31'),
  },
  {
    id: 3,
    name: 'Alice Johnson',
    email: 'alicejohnson@example.com',
    lastLogin: new Date('2023-05-29'),
  },
  {
    id: 4,
    name: 'Robert Brown',
    email: 'robertbrown@example.com',
    lastLogin: new Date('2023-05-28'),
  },
  {
    id: 5,
    name: 'Emily Wilson',
    email: 'emilywilson@example.com',
    lastLogin: new Date('2023-05-27'),
  },
  {
    id: 6,
    name: 'Michael Davis',
    email: 'michaeldavis@example.com',
    lastLogin: new Date('2023-05-26'),
  },
  {
    id: 7,
    name: 'Olivia Lee',
    email: 'oliviale@example.com',
    lastLogin: new Date('2023-05-25'),
  },
  {
    id: 8,
    name: 'Daniel Anderson',
    email: 'danielanderson@example.com',
    lastLogin: new Date('2023-05-24'),
  },
  {
    id: 9,
    name: 'Sophia Thomas',
    email: 'sophiathomas@example.com',
    lastLogin: new Date('2023-05-23'),
  },
  {
    id: 10,
    name: 'David Garcia',
    email: 'davidgarcia@example.com',
    lastLogin: new Date('2023-05-22'),
  },
  {
    id: 11,
    name: 'Emma Martinez',
    email: 'emmamartinez@example.com',
    lastLogin: new Date('2023-05-21'),
  },
  {
    id: 12,
    name: 'William Taylor',
    email: 'williamtaylor@example.com',
    lastLogin: new Date('2023-05-20'),
  },
  {
    id: 13,
    name: 'Ava Clark',
    email: 'avaclark@example.com',
    lastLogin: new Date('2023-05-19'),
  },
  {
    id: 14,
    name: 'James Rodriguez',
    email: 'jamesrodriguez@example.com',
    lastLogin: new Date('2023-05-18'),
  },
  {
    id: 15,
    name: 'Mia Walker',
    email: 'miawalker@example.com',
    lastLogin: new Date('2023-05-17'),
  },
  {
    id: 16,
    name: 'Benjamin Lewis',
    email: 'benjaminlewis@example.com',
    lastLogin: new Date('2023-05-16'),
  },
  {
    id: 17,
    name: 'Charlotte Young',
    email: 'charlotteyoung@example.com',
    lastLogin: new Date('2023-05-15'),
  },
  {
    id: 18,
    name: 'Alexander Hernandez',
    email: 'alexanderhernandez@example.com',
    lastLogin: new Date('2023-05-14'),
  },
  {
    id: 19,
    name: 'Scarlett Hall',
    email: 'scarletthall@example.com',
    lastLogin: new Date('2023-05-13'),
  },
  {
    id: 20,
    name: 'Henry Scott',
    email: 'henryscott@example.com',
    lastLogin: new Date('2023-05-12'),
  },
];

export const Default: Story = {
  args: {
    children: (
      <>
        <TableCaption>A list of users.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Last Login</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {SAMPLE_USERS.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.lastLogin.toLocaleDateString()}</TableCell>
              <TableCell>
                <Button variant="link">Edit</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>

        <TableFooter>
          <TableRow>
            <TableCell colSpan={3}>Total</TableCell>
            <TableCell className="text-right">{SAMPLE_USERS.length}</TableCell>
          </TableRow>
        </TableFooter>
      </>
    ),
  },
};
