#! /home/swk/bin/perlbrew/perls/perl-5.16.0/bin/perl
# Custom archiver can be used to replace mhonarc. The goal is to invoke the Agora mail importer.
# To enable this archiver, set custom_archiver to the path to this file (in wwsympa.conf).

use lib '/home/swk/bin/sympa/bin';
use strict;
use Getopt::Long;
use Carp;
use Log;

my %options;
unless (GetOptions(\%main::options, 'file=s', 'list=s')){
# funktioniert nicht...?!
    printf STDERR "Usage: $0 --file=<filename> --list=<listname>\n";
    exit (0);
}

unless (open FILE, $main::options{'file'}) {
    &do_log('err', 'Cannot open message file %s : %s',  $main::options{'file'}, $!);
    exit (0);
}

my $file =  $main::options{'file'};
my $list =  $main::options{'list'};

exec "node startImportMails '$file' $list";

exit ;
