from django.db import migrations, models
import django.db.models.deletion
from django.utils import timezone


def seed_questions(apps, schema_editor):
    SecretQuestion = apps.get_model("accounts", "SecretQuestion")
    questions = [
        "Kāds bija jūsu pirmā mājdzīvnieka vārds?",
        "Kāda ir jūsu mammas meitas uzvārds?",
        "Kāds bija jūsu pirmās skolas nosaukums?",
        "Kurā pilsētā jūs piedzimāt?",
        "Kāda ir jūsu mīļākā grāmata bērnībā?",
        "Kāds bija jūsu pirmais auto?",
        "Kurš ir jūsu mīļākais skolotājs?",
        "Kāds ir jūsu mīļākais sporta klubs?",
        "Kāds bija jūsu pirmā darba devēja nosaukums?",
        "Kāds ir jūsu mīļākais brīvdienu galamērķis?",
    ]
    for q in questions:
        SecretQuestion.objects.get_or_create(text=q, defaults={"is_active": True, "created_at": timezone.now()})


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0002_remove_user_language_remove_user_theme_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='SecretQuestion',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('text', models.CharField(max_length=255, unique=True)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(default=timezone.now, editable=False)),
            ],
            options={
                'ordering': ['id'],
            },
        ),
        migrations.AddField(
            model_name='user',
            name='secret_answer',
            field=models.CharField(blank=True, default='', max_length=255),
        ),
        migrations.AddField(
            model_name='user',
            name='profile_completed',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='user',
            name='secret_question',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='users', to='accounts.secretquestion'),
        ),
        migrations.RunPython(seed_questions, migrations.RunPython.noop),
    ]
