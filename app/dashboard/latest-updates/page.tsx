"use client";

import { Plus, Search, Filter, MoreVertical, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const mockData = [
  {
    postId: '00596',
    title: 'Class XI Admission Form 2025-26',
    createdDate: '11/02/25 04:44 PM',
    status: 'New',
    attachment: 'PDF',
    visibility: true,
    updatedDate: '11/02/25 04:44 PM',
  },
  {
    postId: '00596',
    title: 'Class XI Admission Form 2025-26 Class XI Form for the 2025-26 year',
    createdDate: '11/02/25 04:44 PM',
    status: 'Posted',
    attachment: 'PDF',
    visibility: true,
    updatedDate: '11/02/25 04:44 PM',
  },
  {
    postId: '00596',
    title: 'Class XI Admission Form 2025-26',
    createdDate: '11/02/25 04:44 PM',
    status: 'Deleted',
    attachment: 'PDF',
    visibility: false,
    updatedDate: '11/02/25 04:44 PM',
  },
  {
    postId: '00596',
    title: 'Class XI Admission Form 2025-26',
    createdDate: '11/02/25 04:44 PM',
    status: 'Posted',
    attachment: 'PDF',
    visibility: true,
    updatedDate: '11/02/25 04:44 PM',
  },
  {
    postId: '00596',
    title: 'Class XI Admission Form 2025-26',
    createdDate: '11/02/25 04:44 PM',
    status: 'New',
    attachment: 'PDF',
    visibility: true,
    updatedDate: '11/02/25 04:44 PM',
  },
  {
    postId: '00596',
    title: 'Class XI Admission Form 2025-26',
    createdDate: '11/02/25 04:44 PM',
    status: 'Deleted',
    attachment: 'PDF',
    visibility: false,
    updatedDate: '11/02/25 04:44 PM',
  },
];

export default function LatestUpdatesPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Latest Updates</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus size={18} className="mr-2" />
              Add New
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  Bulk Action
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>Delete Selected</DropdownMenuItem>
                <DropdownMenuItem>Export Selected</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <Input placeholder="Search" className="pl-10 w-64" />
            </div>
            <Button variant="outline" size="icon">
              <Filter size={18} />
            </Button>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox />
              </TableHead>
              <TableHead>Post ID</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Created Date & Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Attachment</TableHead>
              <TableHead>Visibility</TableHead>
              <TableHead>Updated Date & Time</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockData.map((item, idx) => (
              <TableRow key={idx}>
                <TableCell>
                  <Checkbox />
                </TableCell>
                <TableCell className="font-medium">{item.postId}</TableCell>
                <TableCell className="max-w-md">{item.title}</TableCell>
                <TableCell className="text-slate-600">{item.createdDate}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      item.status === 'New'
                        ? 'default'
                        : item.status === 'Posted'
                        ? 'secondary'
                        : 'destructive'
                    }
                    className={
                      item.status === 'New'
                        ? 'bg-green-100 text-green-700 hover:bg-green-100'
                        : item.status === 'Posted'
                        ? 'bg-blue-100 text-blue-700 hover:bg-blue-100'
                        : 'bg-red-100 text-red-700 hover:bg-red-100'
                    }
                  >
                    {item.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center text-slate-600">
                    <FileText size={16} className="mr-1" />
                    {item.attachment}
                  </div>
                </TableCell>
                <TableCell>
                  <Switch checked={item.visibility} />
                </TableCell>
                <TableCell className="text-slate-600">{item.updatedDate}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical size={18} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Edit</DropdownMenuItem>
                      <DropdownMenuItem>View</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="p-4 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-slate-600">Results per Page</span>
            <select className="border border-slate-300 rounded px-2 py-1 text-sm">
              <option>10</option>
              <option>25</option>
              <option>50</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">01</Button>
            <Button variant="outline" size="sm">02</Button>
            <Button variant="outline" size="sm">03</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
